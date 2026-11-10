import unittest

import profile_demo_content as content


class ProfileDemoContentTests(unittest.TestCase):
    def test_company_profile_counts(self):
        self.assertEqual(len(content.DOMAINS), 6)
        self.assertEqual(len(content.PROFILE_SERVICES), 18)
        self.assertEqual(len(content.SOLUTIONS), 6)
        self.assertEqual(len(content.SECTORS), 6)
        self.assertEqual(len(content.PROJECT_CATEGORIES), 6)
        self.assertEqual(len(content.DELIVERY_MODELS), 4)

    def test_all_records_have_unique_ids_and_slugs(self):
        groups = [content.DOMAINS, content.PROFILE_SERVICES, content.SOLUTIONS,
                  content.SECTORS, content.PROJECT_CATEGORIES, content.DELIVERY_MODELS, content.TECHNOLOGIES,
                  content.ARTICLE_CATEGORIES, content.ARTICLES, content.DEMO_PROJECTS]
        for records in groups:
            ids = [record['_id'] for record in records]
            slugs = [record['slug'] for record in records]
            self.assertEqual(len(ids), len(set(ids)))
            self.assertEqual(len(slugs), len(set(slugs)))

    def test_relationships_resolve(self):
        ids = {
            'domains': {x['_id'] for x in content.DOMAINS},
            'services': {x['_id'] for x in content.PROFILE_SERVICES},
            'solutions': {x['_id'] for x in content.SOLUTIONS},
            'sectors': {x['_id'] for x in content.SECTORS},
            'categories': {x['_id'] for x in content.PROJECT_CATEGORIES},
            'technologies': {x['_id'] for x in content.TECHNOLOGIES},
            'article_categories': {x['_id'] for x in content.ARTICLE_CATEGORIES},
            'delivery_models': {x['_id'] for x in content.DELIVERY_MODELS},
        }
        for service in content.PROFILE_SERVICES:
            self.assertIn(service['domain_id'], ids['domains'])
        for delivery in content.DELIVERY_MODELS:
            for service_id in delivery.get('service_ids', []):
                self.assertIn(service_id, ids['services'])
        for solution in content.SOLUTIONS:
            for key, group in (('service_ids', 'services'), ('sector_ids', 'sectors'), ('technology_ids', 'technologies')):
                for value in solution.get(key, []):
                    self.assertIn(value, ids[group])
        for project in content.DEMO_PROJECTS:
            self.assertIn(project['category_id'], ids['categories'])
            for key, group in (('service_ids', 'services'), ('solution_ids', 'solutions'), ('sector_ids', 'sectors'), ('technology_ids', 'technologies')):
                for value in project.get(key, []):
                    self.assertIn(value, ids[group])
        for article in content.ARTICLES:
            self.assertIn(article['category_id'], ids['article_categories'])

    def test_records_have_english_and_visuals(self):
        image_groups = [content.DOMAINS, content.PROFILE_SERVICES, content.SOLUTIONS,
                        content.SECTORS, content.PROJECT_CATEGORIES, content.DELIVERY_MODELS,
                        content.ARTICLES, content.DEMO_PROJECTS]
        for records in image_groups:
            for record in records:
                self.assertTrue(record.get('en'))
                self.assertTrue(record.get('image_url') or record.get('main_image_url') or record.get('cover_image_url'))

    def test_demo_projects_are_not_claimed_as_delivered_work(self):
        self.assertEqual(len(content.DEMO_PROJECTS), 6)
        for project in content.DEMO_PROJECTS:
            self.assertTrue(project.get('is_demo', True))
            self.assertIn('نموذج عرض', project['short_desc'])
            self.assertIn('ليس مشروعًا منفذًا', project['short_desc'])

    def test_platforms_are_not_marked_as_official_partners(self):
        for technology in content.TECHNOLOGIES:
            self.assertNotEqual(technology.get('relationship_type'), 'official_partner')


if __name__ == '__main__':
    unittest.main()
